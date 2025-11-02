
import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  postalCode: String,
  country: String,
});

export default AddressSchema;
