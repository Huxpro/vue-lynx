
import { Select, Input } from '@douyinfe/semi-ui';
import { useSwitchSchema, type SchemaOptionsData } from '../hooks/use-switch-schema';
import s from './index.module.scss';

export interface SwitchSchemaProps {
  currentEntryFileUrl: string;
  optionsData: SchemaOptionsData;
  onSwitchSchema: (schema: string) => void;
}
export const SwitchSchema = ({
  currentEntryFileUrl,
  optionsData,
  onSwitchSchema,
}: SwitchSchemaProps) => {
  const {
    appOptions,
    currentApp,
    onSchemaChange,
    onAppTypeChange,
    currentAppType,
  } = useSwitchSchema({
    currentEntryFileUrl,
    optionsData,
    onSwitchSchema,
  });
  return (
    <div className={s['switch-schema']}>
      <div className={s['switch-schema-select']}>
        <Select
          style={{ width: '120px' }}
          value={currentAppType}
          onChange={(v) => onAppTypeChange(v as string)}
        >
          {appOptions?.map((item) => (
            <Select.Option
              style={{ fontSize: '12px' }}
              key={item.name}
              value={item.type}
            >
              {item.name}
            </Select.Option>
          ))}
        </Select>
        <Input
          style={{ marginLeft: '4px' }}
          value={currentApp?.schema}
          onChange={onSchemaChange}
        />
      </div>
    </div>
  );
};
