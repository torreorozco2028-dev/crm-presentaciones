import UsersTable from './users-table';
import { getTotalUsers, getUsers } from './_actions/users-actions';

export default async function UsersPage() {
  const users = await getUsers();
  const totalUsers = await getTotalUsers();
  return <UsersTable data={users} total={totalUsers as number} />;
}
