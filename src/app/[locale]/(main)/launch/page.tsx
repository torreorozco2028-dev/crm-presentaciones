import LaunchTable from './launch-table';
import { getTotalBuildings, getBuildings } from './_actions/building-actions';

export default async function LaunchPage() {
  const buildings = await getBuildings(3, 1);
  const totalBuildings = await getTotalBuildings();
  return <LaunchTable buildings={buildings} total={totalBuildings} />;
}
