export default (sequelize, DataTypes) => {
    return sequelize.define("RoomImage", {
        src: { type: DataTypes.STRING },

        // I have commented this out because it is not in your screenshot.
        // If your DB actually HAS this column (maybe scrolled to the right?), uncomment it!
        // houseId: { type: DataTypes.INTEGER }, 
    }, {
        tableName: 'roomimages',
        timestamps: true
    });
};