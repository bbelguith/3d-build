export default (sequelize, DataTypes) => {
    return sequelize.define("HouseImage", {
        src: { type: DataTypes.STRING },
        houseId: { type: DataTypes.INTEGER },
    }, {
        tableName: 'houseimages',
        timestamps: true
    });
};