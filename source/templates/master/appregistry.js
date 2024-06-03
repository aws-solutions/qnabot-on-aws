/** *******************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/                                                                               *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 ******************************************************************************************************************** */

module.exports = {
    Application: {
        Type: 'AWS::ServiceCatalogAppRegistry::Application',
        Properties: {
            Description: 'Service Catalog application to track and manage all your resources for the solution qnabot-on-aws',
            Name: { // This property has a 256 character limit
                'Fn::Join': [
                    '-',
                    [
                        // application names can not start with 'AWS', so prepend 'App' to all Applications
                        // this defends against errors thrown when stack names start with 'AWS'
                        'App',
                        { Ref: 'AWS::StackName' },
                        { 'Fn::FindInMap': ['Solution', 'Data', 'AppRegistryApplicationName'] },
                    ],
                ],
            },
            Tags: {
                'Solutions:SolutionID': { 'Fn::FindInMap': ['Solution', 'Data', 'ID'] },
                'Solutions:SolutionVersion': { 'Fn::FindInMap': ['Solution', 'Data', 'Version'] },
                'Solutions:SolutionName': { 'Fn::FindInMap': ['Solution', 'Data', 'SolutionName'] },
                'Solutions:ApplicationType': { 'Fn::FindInMap': ['Solution', 'Data', 'ApplicationType'] },
            },
        },
    },
    DefaultApplicationAttributes: {
        Type: 'AWS::ServiceCatalogAppRegistry::AttributeGroup',
        Properties: {
            Attributes: {
                SolutionID: { 'Fn::FindInMap': ['Solution', 'Data', 'ID'] },
                Version: { 'Fn::FindInMap': ['Solution', 'Data', 'Version'] },
                SolutionName: { 'Fn::FindInMap': ['Solution', 'Data', 'SolutionName'] },
                ApplicationType: { 'Fn::FindInMap': ['Solution', 'Data', 'ApplicationType'] },
            },
            Description: 'Attribute group for solution information',
            Name: { // This property has a 256 character limit
                'Fn::Join': [
                    '-',
                    [
                        // attribute group names can not start with 'AWS', so prepend 'AttrGrp'
                        // this defends against errors thrown when stack names start with 'AWS'
                        'AttrGrp',
                        { Ref: 'AWS::StackName' },
                    ],
                ],
            },
        },
    },
    AppRegistryApplicationAttributeAssociation: {
        Type: 'AWS::ServiceCatalogAppRegistry::AttributeGroupAssociation',
        Properties: {
            Application: { 'Fn::GetAtt': ['Application', 'Id'] },
            AttributeGroup: { 'Fn::GetAtt': ['DefaultApplicationAttributes', 'Id'] },
        },
    },
    // add resource association for the main stack
    AppRegistryApplicationStackAssociation: {
        Type: 'AWS::ServiceCatalogAppRegistry::ResourceAssociation',
        Properties: {
            Application: { 'Fn::GetAtt': ['Application', 'Id'] },
            Resource: { Ref: 'AWS::StackId' },
            ResourceType: 'CFN_STACK',
        },
    },
    // add resource associations for each of the nested stacks
    AppRegistryApplicationStackAssociationExamples: {
        Type: 'AWS::ServiceCatalogAppRegistry::ResourceAssociation',
        Condition: 'BuildExamples',
        Properties: {
            Application: { 'Fn::GetAtt': ['Application', 'Id'] },
            Resource: { Ref: 'ExamplesStack' },
            ResourceType: 'CFN_STACK',
        },
    },
    AppRegistryApplicationStackAssociationExport: {
        Type: 'AWS::ServiceCatalogAppRegistry::ResourceAssociation',
        Properties: {
            Application: { 'Fn::GetAtt': ['Application', 'Id'] },
            Resource: { Ref: 'ExportStack' },
            ResourceType: 'CFN_STACK',
        },
    },
    AppRegistryApplicationStackAssociationImport: {
        Type: 'AWS::ServiceCatalogAppRegistry::ResourceAssociation',
        Properties: {
            Application: { 'Fn::GetAtt': ['Application', 'Id'] },
            Resource: { Ref: 'ImportStack' },
            ResourceType: 'CFN_STACK',
        },
    },
    AppRegistryApplicationStackAssociationSagemakerEmbeddings: {
        Type: 'AWS::ServiceCatalogAppRegistry::ResourceAssociation',
        Condition: 'EmbeddingsSagemaker',
        Properties: {
            Application: { 'Fn::GetAtt': ['Application', 'Id'] },
            Resource: { Ref: 'SagemakerEmbeddingsStack' },
            ResourceType: 'CFN_STACK',
        },
    },
    AppRegistryApplicationStackAssociationTestAll: {
        Type: 'AWS::ServiceCatalogAppRegistry::ResourceAssociation',
        Properties: {
            Application: { 'Fn::GetAtt': ['Application', 'Id'] },
            Resource: { Ref: 'TestAllStack' },
            ResourceType: 'CFN_STACK',
        },
    },
};
