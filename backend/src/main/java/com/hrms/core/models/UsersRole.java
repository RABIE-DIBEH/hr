package com.hrms.core.models;

import jakarta.persistence.*;

@Entity
@Table(name = "Users_Roles")
public class UsersRole {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long roleId;

    @Column(nullable = false, unique = true)
    private String roleName;

    public UsersRole() {}
    public UsersRole(String name) { this.roleName = name; }

    public Long getRoleId() { return roleId; }
    public void setRoleId(Long id) { this.roleId = id; }
    public String getRoleName() { return roleName; }
    public void setRoleName(String name) { this.roleName = name; }
}
