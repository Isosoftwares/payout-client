import { useEffect } from "react";
import {
  useMaterialTailwindController,
  setOpenSidenav,
} from "../context/sidenav-context";

const usePrimaryColor = () => {
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, sidenavType } = controller;

  return `bg-${sidenavColor}-500`;
};

export default usePrimaryColor;
