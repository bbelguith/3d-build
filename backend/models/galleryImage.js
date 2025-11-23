export default (sequelize, DataTypes) => {
    return sequelize.define("GalleryImage", {
        src: { type: DataTypes.STRING },
        // houseId: { type: DataTypes.INTEGER }, // Commented out to prevent crash
    }, {
        tableName: 'galleryimages',
        timestamps: true
    });
};