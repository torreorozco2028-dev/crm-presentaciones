import { faker } from '@faker-js/faker';
import roles from '../roles';
import bcrypt from 'bcryptjs';
const totalUsers = 20;

async function generateUsers() {
  const data = [];

  for (let i = 0; i < totalUsers; i++) {
    const randomIndex = Math.floor(Math.random() * roles.length);

    const randomeRole = roles.find((_, index) => index === randomIndex);
    const user = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: await bcrypt.hash('demo1234', 10),
      role: randomeRole,
      emailVerified: new Date(),
      image: faker.image.avatar(),
    };
    data.push(user);
  }

  return data;
}

export default async function createFakeUsers() {
  try {
    const users = await generateUsers();

    return users;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
