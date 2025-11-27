import { videos } from '../data/videos.js';

export default {
  async up(queryInterface, Sequelize) {
    // Prevent duplicate keys if re-seeding
    await queryInterface.bulkDelete('videos', null, {});

    const data = videos.map(v => ({
      src: v.src,
      title: v.title || "Video",
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    if (data.length > 0) {
      await queryInterface.bulkInsert('videos', data, {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('videos', null, {});
  }
};