export class EmailQuery {
  email: string;
  userId: number;
  userProfile: UserProfile;
}

export type UserProfile = {
  name: string;
  dateOfBirth: Date;
};
