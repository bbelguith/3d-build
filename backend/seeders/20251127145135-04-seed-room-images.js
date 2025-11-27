import { roomImages } from '../data/roomImages.js';

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roomimages', null, {});

    const data = roomImages.map(img => ({
      src: typeof img === 'string' ? img : img.src,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    if (data.length > 0) {
      await queryInterface.bulkInsert('roomimages', data, {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roomimages', null, {});
  }
};