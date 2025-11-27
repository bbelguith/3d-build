import { floorPlanImages } from '../data/floorPlanImages.js';

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('floorplanimages', null, {});

    const data = floorPlanImages.map(img => ({
      src: typeof img === 'string' ? img : img.src,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    if (data.length > 0) {
      await queryInterface.bulkInsert('floorplanimages', data, {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('floorplanimages', null, {});
  }
};