/**
 * Panther is a Cloud-Native SIEM for the Modern Security Team.
 * Copyright (C) 2020 Panther Labs Inc
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import React from 'react';
import useRouter from 'Hooks/useRouter';
import { Alert, Box, Flex, Card, TabList, TabPanel, TabPanels, Tabs } from 'pouncejs';
import { BorderedTab, BorderTabDivider } from 'Components/BorderedTab';

import {
  getComplianceItemsTotalCount,
  convertObjArrayValuesToCsv,
  extractErrorMessage,
} from 'Helpers/utils';
import withSEO from 'Hoc/withSEO';
import ErrorBoundary from 'Components/ErrorBoundary';
import PolicyCardDetails from './PolicyCardDetails';
import PolicyDetailsInfo from './PolicyDetailsInfo';
import PolicyDetailsResources from './PolicyDetailsResources';
import PolicyDetailsPageSkeleton from './Skeleton';
import { usePolicyDetails } from './graphql/policyDetails.generated';

const PolicyDetailsPage = () => {
  const { match } = useRouter<{ id: string }>();

  const { error, data, loading } = usePolicyDetails({
    fetchPolicy: 'cache-and-network',
    variables: {
      policyDetailsInput: {
        id: match.params.id,
      },
      resourcesForPolicyInput: convertObjArrayValuesToCsv({
        policyId: match.params.id,
      }),
    },
  });

  if (loading && !data) {
    return <PolicyDetailsPageSkeleton />;
  }

  if (error) {
    return (
      <Box mb={6}>
        <Alert
          variant="error"
          title="Couldn't load policy"
          description={
            extractErrorMessage(error) ||
            "An unknown error occured and we couldn't load the policy details from the server"
          }
        />
      </Box>
    );
  }

  const totalCounts = data.resourcesForPolicy.totals;

  const totals = getComplianceItemsTotalCount(totalCounts);
  const policyHasResources = totals > 0;

  return (
    <Box as="article">
      <Flex direction="column" spacing={6} my={6}>
        <ErrorBoundary>
          <PolicyDetailsInfo policy={data.policy} />
        </ErrorBoundary>
        <Card position="relative">
          <Tabs>
            <Box px={2}>
              <TabList>
                <BorderedTab>Details</BorderedTab>
                <BorderedTab>Resources {policyHasResources ? `(${totals})` : ''}</BorderedTab>
              </TabList>
              <BorderTabDivider />
              <TabPanels>
                <TabPanel data-testid="policy-details-tabpanel" lazy unmountWhenInactive>
                  <PolicyCardDetails policy={data.policy} />
                </TabPanel>
                <TabPanel data-testid="policy-resources-tabpanel" lazy unmountWhenInactive>
                  <PolicyDetailsResources />
                </TabPanel>
              </TabPanels>
            </Box>
          </Tabs>
        </Card>
      </Flex>
    </Box>
  );
};

export default withSEO({ title: ({ match }) => match.params.id })(PolicyDetailsPage);
