export type UserInterface = {
  token: {
    type: string;
    name: string;
    token: string;
    abilities: ["*"];
    lastUsedAt: string;
    expiresAt: string;
  };
  expiresAt: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  };
};

export type LoginDTO = {
  email: string;
  password: string;
};
