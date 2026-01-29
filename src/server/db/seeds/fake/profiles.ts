import User from '../../entities/user';
import { faker } from '@faker-js/faker';

const totalProfiles = 20;

async function createFakeProfiles() {
  const user = new User();
  const userIds = await user.getUserIds();
  const fakeProfiles = [];

  for (let i = 0; i < totalProfiles; i++) {
    const profile = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      cellphone: faker.phone.number(),
      telephone: faker.phone.imei(),
      mainAddress: faker.location.streetAddress(),
      secondAddress: faker.location.secondaryAddress(),
      userId: userIds[i],
    };

    fakeProfiles.push(profile);
  }

  return fakeProfiles;
}

export default createFakeProfiles;
