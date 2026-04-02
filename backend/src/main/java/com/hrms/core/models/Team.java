package com.hrms.core.models;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "Teams")
public class Team {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long teamId;

    @Column(nullable = false, unique = true)
    private String name;

    private Long managerId; // The ID of the employee who is the lead

    public Team() {}
    public Team(Long id, String name) { this.teamId = id; this.name = name; }

    // Getters and Setters
    public Long getTeamId() { return teamId; }
    public void setTeamId(Long id) { this.teamId = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Long getManagerId() { return managerId; }
    public void setManagerId(Long id) { this.managerId = id; }
}
