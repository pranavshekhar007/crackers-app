const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");

const comboProductRatingSchema = mongoose.Schema({
    review: {
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        default: true,
    },
    comboProductId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ComboProduct",
        required: true, 
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true, 
    },
});

comboProductRatingSchema.plugin(timestamps);
module.exports = mongoose.model("ComboProductRating", comboProductRatingSchema);
