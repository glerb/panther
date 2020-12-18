package sources

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

import (
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/panther-labs/panther/api/lambda/source/models"
	"github.com/panther-labs/panther/internal/log_analysis/log_processor/registry"
)

func Test_BuildClassifier_NoLogTypes(t *testing.T) {
	var logTypes []string
	src := &models.SourceIntegration{
		SourceIntegrationMetadata: models.SourceIntegrationMetadata{
			IntegrationID:    "integration-id",
			IntegrationLabel: "integration-label",
		},
	}
	c, err := BuildClassifier(logTypes, src, registry.NativeLogTypesResolver())
	require.NoError(t, err)

	_, err = c.Classify(`{"key":"value}"`)

	require.Error(t, err)
	require.Equal(t, "failed to classify log line", err.Error())
}
