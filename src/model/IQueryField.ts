export type IQueryFieldType =
  | 'Text'
  | 'Number'
  | 'DateTime'
  | 'Guid'
  | 'MultiChoice'
  | 'Lookup';

export interface IQueryField {
  name: string;
  value: string;
  type?: IQueryFieldType;
  comparer:
    | 'BeginsWith'
    | 'Contains'
    | 'DateRangesOverlap'
    | 'Eq'
    | 'Geq'
    | 'Gt'
    | 'Includes'
    | 'IsNotNull'
    | 'IsNull'
    | 'Leq'
    | 'Lt'
    | 'Neq'
    | 'NotIncludes'
    | 'Values';
  includeTimeValue?: boolean;
}
