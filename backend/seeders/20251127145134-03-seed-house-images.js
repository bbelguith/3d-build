import { houseImages } from '../data/houseImages.js';

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('houseimages', null, {});

    // 1. Fetch real House IDs (table name matches migration 'houses')
    const houses = await queryInterface.sequelize.query(
      `SELECT id from houses ORDER BY id ASC;`
    );
    const houseRows = houses[0];

    const data = [];

    // 2. Map images to houses
    if (houseRows.length > 0) {
      houseImages.forEach((img, index) => {
        if (houseRows[index]) {
          data.push({
            src: img.src,
            houseId: houseRows[index].id, // Links image to house
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      });

      if (data.length > 0) {
        await queryInterface.bulkInsert('houseimages', data, {});
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('houseimages', null, {});
  }
};