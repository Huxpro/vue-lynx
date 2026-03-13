import { useMemo } from 'react';
import { useState } from 'react';
import { getUrlFromMustacheSchema } from '../utils/tool';
import { getCloneData } from '../utils/tool';

export interface SchemaOptionType {
  type: string;
  name: string;
  schema: string;
  prefix: string;
}
export interface SchemaOptionsData {
  [key: string]: SchemaOptionType;
}

export const useSwitchSchema = ({
  currentEntryFileUrl,
  optionsData,
  onSwitchSchema,
}: {
  currentEntryFileUrl: string;
  optionsData: SchemaOptionsData;
  onSwitchSchema: (schema: string) => void;
}) => {
  const [currentApp, setCurrentApp] = useState<SchemaOptionType>(
    Object.values(optionsData)[0],
  );
  const [allAppData, setAllAppData] = useState<SchemaOptionType>(
    getCloneData(optionsData),
  );
  const onAppTypeChange = (v: string) => {
    setCurrentApp(optionsData[v]);
  };
  const onSchemaChange = (schema: string) => {
    if (!currentApp) {
      return;
    }
    if (schema !== currentApp.schema) {
      const newAllAppData = getCloneData(allAppData);

      let { prefix } = newAllAppData[currentApp.type];
      try {
        prefix = new URL(schema).protocol.replace(/:/g, '');
      } catch (e) {
        console.error(e);
      }

      newAllAppData[currentApp.type].schema = schema;
      newAllAppData[currentApp.type].prefix = prefix;

      setCurrentApp(getCloneData(newAllAppData[currentApp.type]));
      setAllAppData(getCloneData(newAllAppData));
    }
  };

  const schemaWithTemplateUrl = useMemo(() => {
    const schema = getUrlFromMustacheSchema(
      currentApp?.schema ?? '',
      currentEntryFileUrl || '',
    );
    onSwitchSchema(schema);
    return schema;
  }, [currentApp?.schema, currentEntryFileUrl]);

  const appOptions: SchemaOptionType[] = useMemo(() => {
    return Object.values(allAppData);
  }, [allAppData]);
  return {
    schemaWithTemplateUrl,
    currentApp,
    onSchemaChange,
    onAppTypeChange,
    currentAppType: currentApp?.type,
    appOptions,
  };
};
