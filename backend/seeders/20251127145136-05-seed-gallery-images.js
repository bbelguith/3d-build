import { galleryImages } from '../data/galleryImages.js';

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('galleryimages', null, {});

    const data = galleryImages.map(img => ({
      src: typeof img === 'string' ? img : img.src,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    if (data.length > 0) {
      await queryInterface.bulkInsert('galleryimages', data, {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('galleryimages', null, {});
  }
};