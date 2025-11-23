export default (sequelize, DataTypes) => {
    return sequelize.define("FloorPlanImage", {
        src: { type: DataTypes.STRING },
        // houseId: { type: DataTypes.INTEGER }, // Commented out to prevent crash
    }, {
        tableName: 'floorplanimages',
        timestamps: true
    });
};