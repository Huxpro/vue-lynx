type RenameBindToOn<T> = {
  [P in keyof T as P extends `bind${infer Rest}` ? `on${Capitalize<Rest>}` : P]: T[P]
}

type NonBindProps<T> = Omit<T, `bind${string}` | 'className'>

export type VueLynxProps<T> = RenameBindToOn<T> & NonBindProps<T>
