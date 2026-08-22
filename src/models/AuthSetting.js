import mongoose from "mongoose";

const DEFAULT_LOGIN_IMAGE = "";
const DEFAULT_REGISTER_IMAGE = "";

const authSettingSchema = new mongoose.Schema(
  {
    loginImage: {
      type: String,
      default: DEFAULT_LOGIN_IMAGE,
    },
    registerImage: {
      type: String,
      default: DEFAULT_REGISTER_IMAGE,
    },
    emailLogo: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("AuthSetting", authSettingSchema);
export { DEFAULT_LOGIN_IMAGE, DEFAULT_REGISTER_IMAGE };
