export default (sequelize, DataTypes) => {
    return sequelize.define("Video", {
        src: { type: DataTypes.STRING, allowNull: false },
        title: { type: DataTypes.STRING, allowNull: false },
    }, {
        tableName: 'videos', // <--- LOWERCASE
        timestamps: true
    });
};