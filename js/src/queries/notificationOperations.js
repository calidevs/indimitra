import { gql } from '@apollo/client';

export const SEND_TEST_NOTIFICATION = gql`
  mutation SendTestNotification($title: String!, $message: String!) {
    sendTestNotification(title: $title, message: $message) {
      success
      title
      message
    }
  }
`;
