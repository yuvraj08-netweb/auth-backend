import transport from "../middlewares/sendMail.js";
import {
  acceptCodeSchema,
  acceptFPCodeSchema,
  changePasswordSchema,
  signinSchema,
  signupSchema,
} from "../middlewares/validator.js";
import User from "../models/usersModel.js";
import { doHash, doHashValidation, hmacProcess } from "../utils/hashing.js";
import jwt from "jsonwebtoken";

// User Sign Up Function
export const signup = async (req, res) => {
  // destructure email and password from the request body
  const { email, password } = req.body;
  try {
    //validate the data
    const { error, value } = signupSchema.validate({ email, password });

    // check if there is any error in the data format specified and if yes return error
    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }

    // check if the user with that email already exist ?
    const existingUser = await User.findOne({ email });

    // if user exists return the error
    if (existingUser) {
      return res
        .status(401)
        .json({ success: false, message: "User already exists!" });
    }

    // hashing the password before storing it in the db
    const hashPassword = await doHash(password, 12);

    // creating the new user object with the hash password
    const newUser = new User({
      email,
      password: hashPassword,
    });

    // saving the user in the db
    const result = await newUser.save();

    // setting the password undefined so not to send it in the API response.
    result.password = undefined;

    // return the success response
    res.status(201).json({
      success: true,
      message: "Your account has been created successfully",
      result,
    });
  } catch (error) {
    // handle the error
    console.log(error);
  }
};

// User Sign In Function
export const signin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { error, value } = signinSchema.validate({ email, password });

    // check if there is any error in the data format specified and if yes return error
    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }

    // check if the user with that email already exist ?
    const existingUser = await User.findOne({ email }).select("+password");

    // if user does not exists return the error
    if (!existingUser) {
      return res
        .status(401)
        .json({ success: false, message: "User does not exists!" });
    }

    // compare the passwords
    const result = await doHashValidation(password, existingUser.password);

    if (!result) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid password." });
    }

    // Sign Token with JWT
    const token = jwt.sign(
      {
        userId: existingUser._id,
        email: existingUser.email,
        verified: existingUser.verified,
      },
      process.env.TOKEN_SECRET,
      {
        expiresIn: "8h",
      }
    );

    res
      .cookie("Authorization", "Bearer" + token, {
        expires: new Date(Date.now() + 8 * 3600000),
        httpOnly: process.env.NODE_ENV === "production",
        secure: process.env.NODE_ENV === "production",
      })
      .json({
        success: true,
        token,
        message: "Logged in successfully",
      });
  } catch (error) {
    console.log(error);
  }
};

// User Sign Out Function
export const signout = async (req, res) => {
  res.clearCookie("Authorization").status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// Send verification code
export const sendVerificationCode = async (req, res) => {
  const { email } = req.body;
  try {
    // check if the user with that email already exist ?
    const existingUser = await User.findOne({ email });

    // if user exists return the error
    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exists!" });
    }

    // check if user is already verified
    if (existingUser.verified) {
      return res.status(400).json({
        success: false,
        message: "You are already verified!",
      });
    }

    // if not, create the code to verify it
    const codeValue = Math.floor(Math.random() * 1000000).toString();

    let info = await transport.sendMail({
      from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      to: existingUser.email,
      subject: "verification code",
      html: "<h1>" + codeValue + "</h1>",
    });

    if (info.accepted[0] === existingUser.email) {
      const hashedCodeValue = hmacProcess(
        codeValue,
        process.env.HMAC_VERIFICATION_CODE_SECRET
      );
      existingUser.verificationCode = hashedCodeValue;
      existingUser.verificationCodeValidation = Date.now();
      await existingUser.save();
      return res.status(200).json({
        success: true,
        message: "Code sent successfully!",
      });
    }
    return res.status(400).json({
      success: false,
      message: "Code sent failed!",
    });
  } catch (error) {
    console.log(error);
  }
};

// verify verification code
export const verifyVerificationCode = async (req, res) => {
  const { email, code } = req.body;

  try {
    // Validate input
    const { error } = acceptCodeSchema.validate({ email, code });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // Find the user with verification details
    const existingUser = await User.findOne({ email }).select(
      "+verificationCode +verificationCodeValidation"
    );

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User does not exist!",
      });
    }

    if (existingUser.verified) {
      return res.status(400).json({
        success: false,
        message: "You are already verified!",
      });
    }

    if (
      !existingUser.verificationCode ||
      !existingUser.verificationCodeValidation
    ) {
      return res.status(400).json({
        success: false,
        message: "Verification code not sent!",
      });
    }

    // Validate the verification code
    const hashedCode = hmacProcess(
      code,
      process.env.HMAC_VERIFICATION_CODE_SECRET
    );

    const isCodeValid = hashedCode === existingUser.verificationCode;
    const isCodeExpired =
      Date.now() - existingUser.verificationCodeValidation > 10 * 60 * 1000; // 10 minutes

    if (isCodeValid && !isCodeExpired) {
      existingUser.verified = true;
      existingUser.verificationCode = undefined;
      existingUser.verificationCodeValidation = undefined;
      await existingUser.save();

      return res.status(200).json({
        success: true,
        message: "Your account has been verified successfully!",
      });
    }

    if (isCodeExpired) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired!",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid verification code!",
    });
  } catch (err) {
    console.error("Verification error:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};

// change password
export const changePassword = async (req, res) => {
  const { userId, verified } = req.user;
  const { oldPassword, newPassword } = req.body;
  try {
    const { error, value } = changePasswordSchema.validate({
      oldPassword,
      newPassword,
    });

    // check if there is any error in the data format specified and if yes return error
    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }

    if (!verified) {
      return res.status(401).json({
        success: false,
        message: "You are not verified!",
      });
    }
    // check if the user with that email already exist ?
    const existingUser = await User.findById(userId).select("+password");
    // if user does not exists return the error
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User does not exists!",
      });
    }

    // compare the passwords
    const result = await doHashValidation(oldPassword, existingUser.password);

    if (!result) {
      return res.status(401).json({
        success: false,
        message: "Invalid password.",
      });
    }

    // hashing the password before storing it in the db
    const hashPassword = await doHash(newPassword, 12);
    // updating the password in the db
    existingUser.password = hashPassword;
    // saving the user in the db
    await existingUser.save();
    // return the success response
    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
      result: {
        id: existingUser._id,
        email: existingUser.email,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

// forget password
export const sendForgetPasswordCode = async (req, res) => {
  const { email } = req.body;
  try {
    // check if the user with that email already exist ?
    const existingUser = await User.findOne({ email });

    // if user exists return the error
    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exists!" });
    }

    // if not, create the code to verify it
    const codeValue = Math.floor(Math.random() * 1000000).toString();

    let info = await transport.sendMail({
      from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      to: existingUser.email,
      subject: "forgot password code",
      html: "<h1>" + codeValue + "</h1>",
    });

    if (info.accepted[0] === existingUser.email) {
      const hashedCodeValue = hmacProcess(
        codeValue,
        process.env.HMAC_VERIFICATION_CODE_SECRET
      );
      existingUser.forgotPasswordCode = hashedCodeValue;
      existingUser.forgotPasswordCodeValidation = Date.now();
      await existingUser.save();
      return res.status(200).json({
        success: true,
        message: "Code sent successfully!",
      });
    }
    return res.status(400).json({
      success: false,
      message: "Code sent failed!",
    });
  } catch (error) {
    console.log(error);
  }
};

// verify verification code
export const verifyForgetPasswordCode = async (req, res) => {
  const { email, code, newPassword } = req.body;

  try {
    // Validate input
    const { error } = acceptFPCodeSchema.validate({ email, code, newPassword });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // Find the user with verification details
    const existingUser = await User.findOne({ email }).select(
      "+forgotPasswordCode +forgotPasswordCodeValidation"
    );

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User does not exist!",
      });
    }

    if (
      !existingUser.forgotPasswordCode ||
      !existingUser.forgotPasswordCodeValidation
    ) {
      return res.status(400).json({
        success: false,
        message: "Verification code not sent!",
      });
    }

    // Validate the verification code
    const hashedCode = hmacProcess(
      code,
      process.env.HMAC_VERIFICATION_CODE_SECRET
    );

    const isCodeValid = hashedCode === existingUser.forgotPasswordCode;
    const isCodeExpired =
      Date.now() - existingUser.forgotPasswordCodeValidation > 10 * 60 * 1000; // 10 minutes

    if (isCodeValid && !isCodeExpired) {
      // hashing the password before storing it in the db
      const hashPassword = await doHash(newPassword, 12);
      existingUser.password = hashPassword;
      existingUser.forgotPasswordCode = undefined;
      existingUser.forgotPasswordCodeValidation = undefined;
      await existingUser.save();

      return res.status(200).json({
        success: true,
        message: "Your password is updated successfully!",
      });
    }

    if (isCodeExpired) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired!",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid verification code!",
    });
  } catch (err) {
    console.error("Verification error:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};
