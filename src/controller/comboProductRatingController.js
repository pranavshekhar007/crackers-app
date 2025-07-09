const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const ComboProductRating = require("../model/comboProductRating.Schema");
const ComboProduct = require("../model/comboProduct.Schema");
const comboProductRatingController = express.Router();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");

comboProductRatingController.post("/create", async (req, res) => {
  try {
    const ratingCreated = await ComboProductRating.create(req.body);

    // Calculate the average rating for this combo product
    const comboProductId = ratingCreated.comboProductId;

    const allRatings = await ComboProductRating.find({ comboProductId });

    const totalRatings = allRatings.length;
    const sumRatings = allRatings.reduce((sum, item) => sum + Number(item.rating), 0);

    const averageRating = (sumRatings / totalRatings).toFixed(1);

    // Update combo product's rating field
    await ComboProduct.findByIdAndUpdate(comboProductId, {
      rating: averageRating,
    });

    sendResponse(res, 200, "Success", {
      message: "Your review has been submitted successfully!",
      data: ratingCreated,
      averageRating,
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

comboProductRatingController.post("/list", async (req, res) => {
  try {
    const {
      searchKey = "", 
      status, 
      pageNo=1, 
      pageCount = 10,
      sortByField, 
      sortByOrder
    } = req.body;

    const query = {};
    if (status) query.status = status; 
    if (searchKey) query.review = { $regex: searchKey, $options: "i" }; 

    const sortField = sortByField || "createdAt"; 
    const sortOrder = sortByOrder === "asc" ? 1 : -1; 
    const sortOption = { [sortField]: sortOrder };

    const ratingList = await ComboProductRating.find(query)
      .sort(sortOption)
      .limit(parseInt(pageCount))
      .skip((parseInt(pageNo)-1) * parseInt(pageCount))
      .populate({
        path: "comboProductId",
        select: "name shortDescription",
      })
      .populate({
        path: "userId",
      });

    const totalCount = await ComboProductRating.countDocuments({});
    const activeCount = await ComboProductRating.countDocuments({status:true});

    sendResponse(res, 200, "Success", {
      message: "Combo Product rating list retrieved successfully!",
      data: ratingList,
      documentCount: {totalCount, activeCount, inactiveCount: totalCount-activeCount},
      statusCode:200
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

comboProductRatingController.put("/update", upload.single("image"), async (req, res) => {
  try {
    const id = req.body._id;

    const ratingData = await ComboProductRating.findById(id);
    if (!ratingData) {
      return sendResponse(res, 404, "Failed", {
        message: "Rating not found",
      });
    }

    let updatedData = { ...req.body };

    if (req.file) {
      if (ratingData.image) {
        const publicId = ratingData.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId, (error, result) => {
          if (error) console.error("Error deleting old image from Cloudinary:", error);
          else console.log("Old image deleted from Cloudinary:", result);
        });
      }

      const image = await cloudinary.uploader.upload(req.file.path);
      updatedData.image = image.url;
    }

    const updatedRating = await ComboProductRating.findByIdAndUpdate(id, updatedData, {
      new: true,
    });

    sendResponse(res, 200, "Success", {
      message: "Rating updated successfully!",
      data: updatedRating,
      statusCode:200
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

comboProductRatingController.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const ratingItem = await ComboProductRating.findById(id);
    if (!ratingItem) {
      return sendResponse(res, 404, "Failed", {
        message: "Rating not found",
      });
    }

    if (ratingItem.image) {
      const publicId = ratingItem.image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) console.error("Error deleting image from Cloudinary:", error);
        else console.log("Cloudinary image deletion result:", result);
      });
    }

    await ComboProductRating.findByIdAndDelete(id);

    sendResponse(res, 200, "Success", {
      message: "Rating and associated image deleted successfully!",
      statusCode:200
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

module.exports = comboProductRatingController;
