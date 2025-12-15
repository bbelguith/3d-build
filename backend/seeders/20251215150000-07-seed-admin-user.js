import bcrypt from "bcrypt";

export default {
  async up(queryInterface) {
    // Remove any previous record for this email to keep seed idempotent
    await queryInterface.bulkDelete(
      "users",
      { email: "admin@eaglevision.com" },
      {}
    );

    const hashed = await bcrypt.hash("ev123@", 10);

    await queryInterface.bulkInsert(
      "users",
      [
        {
          email: "admin@eaglevision.com",
          password: hashed,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete(
      "users",
      { email: "admin@eaglevision.com" },
      {}
    );
  },
};

