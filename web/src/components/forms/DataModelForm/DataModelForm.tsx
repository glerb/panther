import React from 'react';
import { Box, Card, Flex, Grid, Heading, Text, IconButton, useSnackbar } from 'pouncejs';
import * as Yup from 'yup';
import { Formik, Form, Field, FieldArray, FastField } from 'formik';
import { DataModelMapping } from 'Generated/schema';
import Breadcrumbs from 'Components/Breadcrumbs';
import LinkButton from 'Components/buttons/LinkButton';
import SubmitButton from 'Components/buttons/SubmitButton';
import urls from 'Source/urls';
import Panel from 'Components/Panel';
import FormikTextInput from 'Components/fields/TextInput';
import FormikSwitch from 'Components/fields/Switch';
import FormikCombobox from 'Components/fields/ComboBox';
import { useListAvailableLogTypes } from 'Source/graphql/queries';
import FormikEditor from 'Components/fields/Editor';

export interface DataModelFormValues {
  displayName: string;
  id: string;
  enabled: boolean;
  logType: string;
  mappings: DataModelMapping[];
  body?: string;
}

export interface DataModelFormProps {
  initialValues: DataModelFormValues;
  onSubmit: (values: DataModelFormValues) => Promise<any>;
}

const validationSchema = Yup.object<DataModelFormValues>({
  displayName: Yup.string().required(),
  id: Yup.string().required(),
  enabled: Yup.boolean().required(),
  logType: Yup.string().required(),
  mappings: Yup.array<DataModelMapping>()
    .of(
      Yup.object().shape<DataModelMapping>(
        {
          name: Yup.string().required(),
          method: Yup.string()
            .test('mutex', "You shouldn't provide both a path & method", function (method) {
              return !this.parent.path || !method;
            })
            .when('path', {
              is: path => !path,
              then: Yup.string().required('Either a path or a method must be specified'),
              otherwise: Yup.string(),
            }),
          path: Yup.string()
            .test('mutex', "You shouldn't provide both a path & method", function (path) {
              return !this.parent.method || !path;
            })
            .when('method', {
              is: method => !method,
              then: Yup.string().required('Either a path or a method must be specified'),
              otherwise: Yup.string(),
            }),
        },
        [['method', 'path']]
      )
    )
    .required(),
  body: Yup.string(),
});

const DataModelForm: React.FC<DataModelFormProps> = ({ initialValues, onSubmit }) => {
  const [isPythonEditorOpen, setPythonEditorVisibility] = React.useState(!!initialValues.body);

  const { pushSnackbar } = useSnackbar();
  const { data } = useListAvailableLogTypes({
    onError: () => pushSnackbar({ title: "Couldn't fetch your available log types" }),
  });

  return (
    <Panel title="New Data Model">
      <Formik<DataModelFormValues>
        initialValues={initialValues}
        onSubmit={onSubmit}
        validationSchema={validationSchema}
      >
        {({ values }) => (
          <Form>
            <Box as="section" mb={8}>
              <Text color="navyblue-100" mb={6}>
                Settings
              </Text>

              <Grid templateColumns="7fr 7fr 5fr 2fr" gap={5} mb={4}>
                <Field
                  as={FormikTextInput}
                  label="Display Name"
                  placeholder="A nickname for this data model"
                  name="displayName"
                  required
                />
                <Field
                  as={FormikTextInput}
                  label="ID"
                  placeholder="An identifier for this data model"
                  name="id"
                  required
                />
                <Field
                  as={FormikCombobox}
                  searchable
                  label="Log Type"
                  name="logType"
                  items={data?.listAvailableLogTypes.logTypes ?? []}
                  placeholder="Where should the rule appoly?"
                />
                <Flex align="center">
                  <Field as={FormikSwitch} name="enabled" label="Enabled" />
                </Flex>
              </Grid>
            </Box>
            <Box as="section">
              <Text color="navyblue-100" mb={6}>
                Data Model Mappings
              </Text>
              <Card as="section" variant="dark" p={4} mb={5}>
                <FieldArray
                  name="mappings"
                  render={arrayHelpers => {
                    return (
                      <Flex direction="column" spacing={4}>
                        {values.mappings.map((mapping, index) => (
                          <Grid key={index} templateColumns="9fr 9fr 9fr 2fr" gap={4}>
                            <Field
                              as={FormikTextInput}
                              label="Name"
                              placeholder="The name of the unified data model field"
                              name={`mappings[${index}].name`}
                              required
                            />
                            <Field
                              as={FormikTextInput}
                              label="Field Path"
                              placeholder="The path to the log type field to map to"
                              name={`mappings[${index}].path`}
                            />
                            <Field
                              as={FormikTextInput}
                              label="Field Method"
                              placeholder="A log type method to map to"
                              name={`mappings[${index}].method`}
                            />
                            <Flex spacing={2} align="center">
                              {index > 0 && (
                                <IconButton
                                  size="medium"
                                  icon="close"
                                  aria-label="Remove mapping"
                                  onClick={() => arrayHelpers.remove(index)}
                                />
                              )}
                              {index === values.mappings.length - 1 && (
                                <IconButton
                                  size="medium"
                                  icon="add"
                                  aria-label="Add a new mapping"
                                  onClick={() =>
                                    arrayHelpers.push({ name: '', method: '', path: '' })
                                  }
                                />
                              )}
                            </Flex>
                          </Grid>
                        ))}
                      </Flex>
                    );
                  }}
                />
              </Card>
              <Card as="section" variant="dark" p={4}>
                <Flex align="center" spacing={4}>
                  <IconButton
                    variant="ghost"
                    active={isPythonEditorOpen}
                    variantColor="navyblue"
                    icon={isPythonEditorOpen ? 'caret-up' : 'caret-down'}
                    onClick={() => setPythonEditorVisibility(v => !v)}
                    size="medium"
                    aria-label="Toggle Python Editor visibility"
                  />
                  <Heading as="h2" size="x-small">
                    Python Module <i>(optional)</i>
                  </Heading>
                </Flex>
                {isPythonEditorOpen && (
                  <Box mt={4}>
                    <FastField
                      as={FormikEditor}
                      placeholder="# Enter the body of this mapping..."
                      name="body"
                      width="100%"
                      minLines={10}
                      mode="python"
                    />
                  </Box>
                )}
              </Card>
            </Box>
            <Breadcrumbs.Actions>
              <Flex justify="flex-end" spacing={4}>
                <LinkButton
                  icon="close-circle"
                  variantColor="darkgray"
                  to={urls.logAnalysis.dataModels.list()}
                >
                  Cancel
                </LinkButton>
                <SubmitButton icon="check-outline" variantColor="green">
                  Save
                </SubmitButton>
              </Flex>
            </Breadcrumbs.Actions>
          </Form>
        )}
      </Formik>
    </Panel>
  );
};

export default DataModelForm;