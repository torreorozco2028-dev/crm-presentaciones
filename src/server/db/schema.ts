import { sessions } from './tables/session-table';
import { users, userRelations } from './tables/user-table';
import { verificationTokens } from './tables/verification-token-table';
import { profiles } from './tables/profile-table';
import { rooms_model } from './tables/rooms_model';
import { common_areas, commonAreasRelations } from './tables/common_areas';
import {
  department_model,
  department_features,
  modelToFeatures,
  departmentModelRelations,
} from './tables/department';
import {
  building,
  general_features,
  buildingRelations,
} from './tables/building';

export {
  users,
  userRelations,
  sessions,
  verificationTokens,
  profiles,
  rooms_model,
  common_areas,
  commonAreasRelations,
  department_model,
  department_features,
  modelToFeatures,
  departmentModelRelations,
  building,
  general_features,
  buildingRelations,
};
