export default (sequelize, DataTypes) => {
  return sequelize.define("House", {
    // id is automatic, so we don't need to define it manually
    number: { type: DataTypes.STRING }, // Matches 'number' column
    state: { type: DataTypes.STRING },  // Matches 'state' column
    type: { type: DataTypes.STRING },   // Matches 'type' column

    // REMOVED 'price' because it is not in your database screenshot
  }, {
    tableName: 'houses', // Lowercase to match DB
    timestamps: true     // Matches createdAt/updatedAt in screenshot
  });
};