export default (sequelize, DataTypes) => {
    return sequelize.define("User", {
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
    }, {
        tableName: 'users', // Explicit lowercase table name
        timestamps: true
    });
};