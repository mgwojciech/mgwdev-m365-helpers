export type IQueryFieldType =
  | 'Text'
  | 'Number'
  | 'DateTime'
  | 'Guid'
  | 'MultiChoice'
  | 'Lookup'
  | 'Membership'
  | 'User';

export interface IQueryField {
    name: string,
    value: string,
    type?: string,
    comparer:  | 'BeginsWith'
    | 'Contains'
    | 'DateRangesOverlap'
    | 'Eq'
    | 'IDEq'
    | 'Geq'
    | 'Gt'
    | 'Includes'
    | 'IsNotNull'
    | 'IsNull'
    | 'Leq'
    | 'Lt'
    | 'Neq'
    | 'NotIncludes'
    | 'Values'
    | 'CurrentUserGroups';
  includeTimeValue?: boolean;
}