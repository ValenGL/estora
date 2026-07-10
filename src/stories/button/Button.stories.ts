import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { Button } from "./Button";

const meta = {
  title: "Estora/Button",
  component: Button,
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "dark",
    },
  },
  tags: ["autodocs"],
  args: { onClick: fn() },
  argTypes: {
    block: { control: "boolean" },
    version: {
      control: "select",
      options: ["primary", "secondary", "outlined", "text"],
    },
    type: {
      control: "select",
      options: ["submit", "reset", "button"],
    },
    color: { control: "text" },
    dropdown: { control: "boolean" },
    isExpanded: { control: "boolean" },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    version: "primary",
    text: "Primary",
  },
};

export const Secondary: Story = {
  args: {
    version: "secondary",
    text: "Secondary",
  },
};

export const Outlined: Story = {
  args: {
    version: "outlined",
    text: "Outlined",
  },
};

export const Disabled: Story = {
  args: {
    version: "disabled",
    text: "Disabled",
  },
};

export const Danger: Story = {
  args: {
    version: "danger",
    text: "Danger",
  },
};

export const Text: Story = {
  args: {
    version: "text",
    text: "Text",
  },
};

export const Dropdown: Story = {
  args: {
    version: "secondary",
    text: "Dropdown",
    dropdown: true,
  },
};
