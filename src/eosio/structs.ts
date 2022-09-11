import { Asset, Name, Struct } from '@greymass/eosio'

export class Transfer extends Struct {
  static abiName = 'transfer'
  static abiFields = [
    {
      name: 'from',
      type: Name,
    },
    {
      name: 'to',
      type: Name,
    },
    {
      name: 'quantity',
      type: Asset,
    },
    {
      name: 'memo',
      type: 'string',
    },
  ]
}
