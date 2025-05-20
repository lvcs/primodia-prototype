import React from 'react';
import { Button, Text, Flex, Card } from '@radix-ui/themes';

function RadixTest() {
  return (
    <Card style={{ maxWidth: 300 }} className="p-4 m-4">
      <Flex direction="column" gap="3">
        <Text as="h2" size="4" weight="bold">Radix UI Test</Text>
        <Text>This component tests that Radix UI is working correctly.</Text>
        <Button variant="solid" color="blue">Radix Button</Button>
      </Flex>
    </Card>
  );
}

export default RadixTest; 