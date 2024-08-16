"use client"

import React from "react";
import { useParams, usePathname } from "next/navigation";

import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Link, DropdownItem, DropdownTrigger, Dropdown, DropdownMenu, Avatar } from "@nextui-org/react";
import "./navigation.css"



// maybe add currentPath as variable
export default function Navigation() {

    const pathname = usePathname();
    const params = useParams();
    const currentPath = pathname.split("/").length >= 3 ? pathname.split("/")[2] : "";

    return (
        <div>
            <Navbar>
                <NavbarBrand>
                    <p className="font-bold text-inherit">ACME</p>
                </NavbarBrand>

                <NavbarContent className="hidden sm:flex gap-4" justify="center">
                    <NavbarItem>
                        <Link color="foreground" href="/home">
                            Home
                        </Link>
                    </NavbarItem>
                    <NavbarItem isActive>
                        <Link href="/videos/list" aria-current="page">
                            Videos
                        </Link>
                    </NavbarItem>
                    <NavbarItem>
                        <Link color="foreground" href="/pictures">
                            Pictures
                        </Link>
                    </NavbarItem>
                    <NavbarItem>
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
                                name="Jason Hughes"
                                size="sm"
                                src="https://i.pravatar.cc/150?u=a042581f4e29026704d"
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

            {/* div for printing the current path (temporary) */}
            <div>
                <label>Pathname</label>
                <p>{pathname}</p>

                <label>Params</label>
                <p>{params.toString()}</p>

                <label>currentPath</label>
                <p>{currentPath}</p>
            </div>

        </div>
    )
}