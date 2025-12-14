import { houses } from '../data/houses.js';

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Houses', null, {});

    const data = houses.map(h => ({
      number: h.number,
      state: h.state,
      type: h.type,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    if (data.length > 0) {
      await queryInterface.bulkInsert('Houses', data, {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Houses', null, {});
  }
};