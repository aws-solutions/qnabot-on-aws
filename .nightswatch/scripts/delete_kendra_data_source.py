######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#                                                                                                                    #
#  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    #
#  with the License. A copy of the License is located at                                                             #
#                                                                                                                    #
#      http://www.apache.org/licenses/LICENSE-2.0                                                                    #
#                                                                                                                    #
#  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES #
#  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    #
#  and limitations under the License.                                                                                #
######################################################################################################################

import boto3

kendra_regions = ['us-east-1', 'us-west-2', 'ap-southeast-1', 'ap-southeast-2', 'ca-central-1', 'eu-west-1']


def get_kendra_index_id(kendra_client):
    response = kendra_client.list_indices()
    index_configuration_summary_items = response['IndexConfigurationSummaryItems']
    for index_configuration_summary_item in index_configuration_summary_items:
        if index_configuration_summary_item['Name'] == 'nightswatch':
            kendra_index_id = index_configuration_summary_item['Id']
            return kendra_index_id

def delete_kendra_data_sources():
    for kendra_region in kendra_regions:
        kendra_client = boto3.client('kendra', region_name=kendra_region)
        kendra_index_id = get_kendra_index_id(kendra_client)
        if (kendra_index_id is None) or (kendra_index_id == 'None'):
            print('kendra_index_id not found.')
        else:
            response = kendra_client.list_data_sources(
                IndexId=kendra_index_id
            )
            summary_items = response['SummaryItems']
            if summary_items:
                for summary_item in summary_items:
                    data_source_id = summary_item['Id']
                    print(
                        kendra_region + ' -:Kendra Index ID:- ' + kendra_index_id + ' -:Data Source ID:- ' + data_source_id)
                    kendra_client.delete_data_source(
                        Id=data_source_id,
                        IndexId=kendra_index_id
                    )
                    print(kendra_region + ' -:Data Source ID - DELETED:- ' + data_source_id)


delete_kendra_data_sources()
