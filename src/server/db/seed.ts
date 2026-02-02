import Profile from './entities/profile';
import createFakeProfiles from './seeds/fake/profiles';
import User from './entities/user';
import createFakeUsers from './seeds/fake/users';

async function main() {
  try {
    console.log('Starting Seeed');

    const profileEntity = new Profile();
    const userEntity = new User();

    //Crear usuarios
    const usersData = await createFakeUsers();
    await userEntity.batchInsertRecords(usersData as any);
    console.log('Users seeded');

    //Crear perfiles
    const profilesData = await createFakeProfiles();
    await profileEntity.batchInsertRecords(profilesData as any);
    console.log('Profiles seeded');

    console.log('Seed Finished Successfully');
    process.exit(0);
  } catch (err) {
    console.error('ERROR DURING SEED: ', err);
    process.exit(1);
  }
}

main();
