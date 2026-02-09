import { sessions } from './tables/session-table';
import { users, userRelations } from './tables/user-table';
import { verificationTokens } from './tables/verification-token-table';
import { profiles } from './tables/profile-table';
import { rooms_model, roomsRelations } from './tables/rooms_model';
import { common_areas, commonAreasRelations } from './tables/common_areas';
import {
  department_model,
  unit_department,
  department_features,
  modelToFeatures,
  departmentModelRelations,
  unitDepartmentRelations,
} from './tables/department';
import {
  building,
  general_features,
  building_to_features,
  buildingRelations,
  generalFeaturesRelations,
  buildingToFeaturesRelations,
} from './tables/building';
import { client, clientRelations } from './tables/client';
import { sales, salesRelations } from './tables/sales';
import {
  construction_phases,
  constructionPhasesRelations,
} from './tables/construction_phases';
import {
  points_interest,
  pointsInterestRelations,
} from './tables/pointsofinterest';
import { sales_stages, salesStagesRelations } from './tables/sales_stages';
import { ourteam } from './tables/ourteam';

export {
  users,
  userRelations,
  sessions,
  verificationTokens,
  profiles,
  rooms_model,
  roomsRelations,
  common_areas,
  commonAreasRelations,
  department_model,
  unit_department,
  department_features,
  generalFeaturesRelations,
  buildingToFeaturesRelations,
  building_to_features,
  modelToFeatures,
  departmentModelRelations,
  unitDepartmentRelations,
  building,
  general_features,
  buildingRelations,
  client,
  clientRelations,
  sales,
  salesRelations,
  constructionPhasesRelations,
  construction_phases,
  ourteam,
  pointsInterestRelations,
  points_interest,
  salesStagesRelations,
  sales_stages,
};
