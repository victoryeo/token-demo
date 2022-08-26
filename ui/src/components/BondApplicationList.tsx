// Copyright (c) 2022 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import React from "react";
import { Icon, List } from "semantic-ui-react";
import { Party } from "@daml/types";
import { BondToken } from "@daml.js/token-demo";

type Props = {
  bondApplications: BondToken.BondApplication[];
};

const BondApplicationList: React.FC<Props> = ({ bondApplications }) => {
  return (
    <List divided relaxed>
      {[...bondApplications].map((bond) => (
        <List.Item key={bond.issuer + bond.name}>
          <List.Content>
            <List.Content floated="right">
              <div>Name: {bond.name}</div>
              <div>Issuer     : {bond.issuer}</div>
              <div>Underwriter: {bond.underwriter}</div>
            </List.Content>
          </List.Content>
        </List.Item>
      ))}
    </List>
  );
};

export default BondApplicationList;
