export default (sequelize, DataTypes) => {
    return sequelize.define("Comment", {
        houseId: { type: DataTypes.INTEGER },
        name: { type: DataTypes.STRING },
        phone: { type: DataTypes.STRING },
        request: { type: DataTypes.STRING },
        text: { type: DataTypes.TEXT },
        date: { type: DataTypes.DATE },

        seen: { type: DataTypes.BOOLEAN, defaultValue: false },
    }, {
        tableName: 'comments', // Lowercase to match DB
        timestamps: true       // Matches createdAt/updatedAt columns
    });
};