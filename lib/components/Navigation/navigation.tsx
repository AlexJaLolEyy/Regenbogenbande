"use client"

import { Avatar, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Image, Link, Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@nextui-org/react";
import NextImage from "next/image";
import { usePathname } from "next/navigation";
import "./navigation.css";


export default function Navigation() {

    const currentPath = usePathname();

    return (
        <div>
            <Navbar className="navbar">
                <NavbarBrand>
                <Image as={NextImage}
                        src="/rainbow.svg"
                        alt="preview could not be loaded"
                        width={"35"} height={"35"}
                        className="image"
                    />
                    <p className="font-bold text-inherit"><b>Regenbogenbande</b></p>
                </NavbarBrand>
                <NavbarContent className="sm:flex gap-4" justify="center">
                    <NavbarItem isActive={currentPath === "/"}>
                        <Link color="foreground" href="/">
                            Home
                        </Link>
                    </NavbarItem>
                    <NavbarItem isActive={currentPath === "/videos"}>
                        <Link color="foreground" href="/videos">
                            Videos
                        </Link>
                    </NavbarItem>
                    <NavbarItem isActive={currentPath === "/pictures"}>
                        <Link color="foreground" href="/pictures">
                            Pictures
                        </Link>
                    </NavbarItem>
                    <NavbarItem isActive={currentPath === "/quotes"}>
                        <Link color="foreground" href="/quotes">
                            Quotes
                        </Link>
                    </NavbarItem>
                </NavbarContent>

                <NavbarContent as="div" justify="end">
                    <Dropdown placement="bottom-end">
                        <DropdownTrigger>
                            <Avatar
                                isBordered
                                as="button"
                                className="transition-transform"
                                color="secondary"
                                size="sm"
                                src="/exampleUserPictures/exampleAlex.jpg"
                            />
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Profile Actions" variant="flat">
                            <DropdownItem key="profile" className="h-14 gap-2">
                                <p className="font-semibold">Signed in as</p>
                                <p className="font-semibold">test@example.com</p>
                            </DropdownItem>
                            <DropdownItem key="settings">My Settings</DropdownItem>
                            <DropdownItem key="configurations">Configurations</DropdownItem>
                            <DropdownItem key="help_and_feedback">Help & Feedback</DropdownItem>
                            <DropdownItem key="logout" color="danger">
                                Log Out
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </NavbarContent>
            </Navbar>

        </div>
    )
}