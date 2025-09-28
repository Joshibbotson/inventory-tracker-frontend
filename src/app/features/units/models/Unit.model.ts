export interface Unit {
  _id: string;
  name: string;
  abbreviation: string;
  type: 'discrete' | 'continuous';
  plural: string;
  createdAt?: Date;
  updatedAt?: Date;
}
