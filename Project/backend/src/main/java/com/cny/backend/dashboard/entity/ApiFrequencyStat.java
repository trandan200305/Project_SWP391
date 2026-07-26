package com.cny.backend.dashboard.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "api_frequency_stat")
public class ApiFrequencyStat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String path;
    private Integer total;
    private Integer success;
    private Integer error400;
    
    @Column(name = "error_customer")
    private Integer errorCustomer;
    
    @Column(name = "error_system")
    private Integer errorSystem;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }
    public Integer getTotal() { return total; }
    public void setTotal(Integer total) { this.total = total; }
    public Integer getSuccess() { return success; }
    public void setSuccess(Integer success) { this.success = success; }
    public Integer getError400() { return error400; }
    public void setError400(Integer error400) { this.error400 = error400; }
    public Integer getErrorCustomer() { return errorCustomer; }
    public void setErrorCustomer(Integer errorCustomer) { this.errorCustomer = errorCustomer; }
    public Integer getErrorSystem() { return errorSystem; }
    public void setErrorSystem(Integer errorSystem) { this.errorSystem = errorSystem; }
}
