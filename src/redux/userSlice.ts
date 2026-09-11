import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserState {
  UserName: string,
  UserId: number;
  Mahal: number;
  FullName: string;
  PostId: number;
  OnvanSemat: string;
  OnvanPost: string;
  IsMarkazShahrestan: string;
  DateNow: string;
}

const initialState: UserState = {
  UserName: "",
  UserId: 0,
  Mahal: 0,
  PostId: 0,
  FullName: "",
  OnvanSemat: "",
  OnvanPost: "",
  DateNow: "",
  IsMarkazShahrestan: "",
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    login: (state, action: PayloadAction<Partial<UserState>>) => {
      Object.assign(state, action.payload);
    },
    logout: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const { login, logout } = userSlice.actions;
export default userSlice.reducer;
